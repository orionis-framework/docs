# Informe técnico: Mail

La revisión utiliza `config/mail.py`, `orionis/mail`, sus contratos, entidades, transportes y pruebas, las entidades de `orionis/foundation/config/mail`, la fachada y el provider. La creación de clases se contrasta con `MakeMail`, `MakeStubCommand`, el generador Stub y `mail.stub`. La integración se comprueba con las implementaciones reales de vistas, Storage, contenedor y aplicación. No modifica la implementación del framework.

## Organización

Nueve guías por idioma, conservando las cuatro URLs anteriores y agregando cinco:

| Grupo | Guías |
| --- | --- |
| Configuración y transportes | Introducción; configuración; SMTP, file y transportes propios. |
| Construcción y envío | Clases Mailable; contenido y vistas; adjuntos desde Storage; envío y resultados. |
| Servicios y referencia | Fachada e inyección; referencia técnica. |

Los ejemplos principales utilizan servicios y controladores asíncronos, con transporte file para inspección local. Cubren fachada `Mail`, DI por constructor y por método, construcción de clases Mailable por el contenedor, callbacks sync/async, vistas HTML/texto, archivos de Storage, limpieza explícita de archivos de trabajo y transportes propios. Dos diagramas por idioma explican el pipeline general y la resolución de cuerpos y vistas.

## Cobertura verificable

`public/downloads/mail-api-inventory.json` registra **178 declaraciones públicas propias en 39 archivos**: 33 clases, 64 campos, ocho constantes, cinco aliases de tipos, 53 métodos, seis sobrecargas y nueve funciones. Sus 58 destinos documentales existen en ES/EN. Cada registro conserva firma, archivo, línea y checksum normalizado de la fuente.

El conteo es léxico: contratos, implementaciones y sobrecargas se conservan como declaraciones separadas. No equivale a 178 funcionalidades distintas. Incluye constructores explícitos; los constructores generados por dataclasses se explican por sus campos. Excluye implementación privada, exports internos, métodos de dataclasses y API heredada de componentes externos al módulo. Las operaciones que MailManager hereda de PendingMail se explican en un mismo apartado de envío.

La API incluye los once métodos fluidos/terminales de PendingMail, `MailManager.extend()`, siete mutadores de Message, tres hooks de Mailable, Envelope, Address y sus helpers, los cinco campos de Content, cuatro de Attachment y `fromStorage()`, ocho de MailOptions y `envelope()`, cinco de PreparedMail, ocho de MailResult, sus tres estados, composer, transportes, factorías, helpers, tipos, excepciones y registro. Configuración comprende 16 campos de entidades y tres overrides del bootstrap, dos valores MailDriver, siete campos SmtpSettings y tres MailEncryption.

El comando `make:mail name`, su normalización, directorios, ausencia de sobrescritura y plantilla se verifican adicionalmente contra las fuentes de consola y pruebas; esas fuentes auxiliares no se incluyen en el conteo del módulo Mail.

## Comportamientos documentados

- `MailProvider` es un provider ordinario que fija Mail durante el arranque normal. El acceso por fachada y por `IMailManager` utiliza el mismo singleton. El composer requiere vistas y Storage aunque una operación solo envíe texto.
- Cada método fluido devuelve otro PendingMail; Message muta solo la configuración del callback actual. Descartar una cadena derivada descarta sus cambios. No hay un `Mail.queue()` ni retry automático.
- `send()` tiene tres sobrecargas y una firma runtime con sentinel MISSING. Enviar Mailable no acepta data/callback adicionales, ni siquiera None explícito. Content lleva su propio contexto. Una cadena de vista representa HTML renderizado, no HTML literal.
- Enviar una clase Mailable crea una instancia nueva mediante `app.build()` y permite DI de constructor. Los hooks son síncronos, sin argumentos adicionales ni inyección de método. Enviar una instancia no reconstruye sus dependencias.
- `make:mail` escribe por defecto en `app/notifications`, acepta subdirectorios, normaliza nombres y no sobrescribe archivos. La plantilla inyecta IApplication, declara remitente/asunto y texto, pero no destinatarios.
- Content permite texto, HTML, vista HTML, vista de texto y contexto explícito. No acepta fuentes duplicadas de la misma alternativa. No convierte HTML a texto, no interpola Jinja en literales ni expone automáticamente los atributos del mailable.
- El normalizador de vistas necesita rutas con `/` para preservar extensiones como `.txt`. Autoescape está activado también para texto en la configuración predeterminada. La guía restringe el bloque `autoescape false` a la alternativa text/plain y mantiene escape en HTML.
- Los contenedores del contexto se copian/congelan; objetos opacos conservan identidad. La unión de destinatarios incluye To/Cc/Bcc, excluye Reply-To y nunca publica Bcc como encabezado MIME.
- Los adjuntos solo tienen constructor y `fromStorage()`. No hay fromBytes/fromPath/fromStream/fromUrl ni inline/CID. Se muestra persistencia previa mediante Storage, incluidos bytes/streams y archivos de trabajo con cleanup explícito. Mail cierra sus streams, pero no elimina el origen.
- El composer prepara cuerpos, adjuntos y MIME antes de crear el transporte y materializa esos datos en memoria. La cancelación de lectura de adjuntos espera la limpieza del stream poseído. SMTP/publicación en executor pueden continuar después de cancelar al consumidor.
- SMTP usa stdlib, STARTTLS obligatorio para TLS y TLS implícito para SSL, verificación de certificados y conexión por envío. La URL tiene precedencia explícita y no reemplaza timeout. Se distinguen aceptación completa, parcial, error y entrega final no confirmada.
- File publica MIME mediante staging, flush/fsync y hard link sin reemplazo. No entrega SMTP ni rota o limpia mensajes automáticamente. Los SDK de terceros no son necesarios para SMTP/file; un disco cloud de adjuntos conserva sus requisitos de Storage.
- El manager conserva factorías, no conexiones SMTP o instancias de transporte. Las extensiones requieren IMailTransport y configuración con driver explícito; no sustituyen los drivers nativos ni añaden capacidades al compositor.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Suite nativa `python -B reactor test --start-dir tests/mail --no-panel --verbosity 1` | 193 pruebas aprobadas, sin errores. SMTP cubierto mediante dobles y límites de red bloqueados. |
| CLI | Ayuda real de `make:mail` contrastada, además de pruebas del generador y su plantilla en un directorio temporal. |
| Clases y contenido | 15 ejemplos Python únicos ejecutados y 62 comprobaciones con Jinja, file temporal, aplicación y contenedor reales: escape, tipos de cuerpo, clases nuevas, parámetros y generación. |
| Envío y resultados | 12 bloques publicados idénticos ES/EN ejecutados, 13 publicaciones temporales y 106 comprobaciones. |
| Configuración, transportes y adjuntos | 26 bloques publicados ejecutados, 78 comprobaciones de configuración y 42 de runtime, incluido Storage, archivo vacío, limpieza, transporte propio y fronteras SMTP simuladas. |
| Fachada, DI y referencia | 24 bloques publicados ejecutados y 33 comprobaciones con aplicación real; constructor, método, Mailable, compositor y lectura MIME. SMTP prohibido en el arnés. |
| Inventario | 178 declaraciones y 39 hashes contrastados; todos los destinos válidos en ambos idiomas. |
| Pruebas del sitio | 19 aprobadas. |
| Sintaxis e imports | 3.716 bloques Python, 276 JSON y 82 JavaScript; 3.008 imports nativos contrastados, sin errores. |
| Construcción y HTML | `npm run build` aprobado: 357 páginas generadas y 356 de contenido verificadas; 2.688 enlaces internos, traducciones, fragments, sitemap y búsqueda correctos. |
| Navegador | Nueve guías ES revisadas a 390 px sin desbordamiento de página y con un enlace activo. Seis tablas de configuración con scroll interno y primera columna legible. Tres submenús, filtro/restauración y cambio ES/EN comprobados; dos diagramas SVG renderizados sin errores a 1440 px. |
| Servidor local | Astro reiniciado y disponible en `http://localhost:4321/es/services/mail`. |

Los subconjuntos nativos ejecutados por las revisiones individuales se solapan con la suite de correo y no se suman como pruebas diferentes. Las comprobaciones de generador cubren una superficie adicional de consola. No se enviaron correos reales ni se contactaron servidores SMTP o servicios cloud externos.

## Mantenimiento

```bash
python -B scripts/audit-mail-source.py --framework-root ../framework
node scripts/validate-mail-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor AST necesita el checkout del framework. `--write` regenera el inventario después de revisar implementación y guía. La validación de destinos está integrada en docs:validate y postbuild y no necesita el checkout del framework en CI.
