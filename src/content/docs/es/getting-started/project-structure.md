---
title: Estructura del proyecto
---

# Estructura de Directorios

La estructura predeterminada de una aplicación `Orionis` está diseñada para proporcionar un excelente punto de partida tanto para aplicaciones minimalistas como empresariales. Sin embargo, eres libre de organizar tu aplicación como prefieras. Orionis no impone casi ninguna restricción sobre dónde se ubica una clase, siempre y cuando se configure correctamente la aplicacion en su proceso de Bootstraping.
Revisa la documentacion del apartado anterior para obtener más información sobre cómo funciona el autoloading en `Orionis`.

## Directorio Raíz

El `root` de tu aplicación contiene varios directorios y archivos importantes. A continuación, se describen brevemente los directorios principales que encontrarás en una nueva instalación de Orionis:

#### Estructura típica del proyecto

```
mi_proyecto/                    # Directorio raíz del proyecto
├── app/                        # Código principal de la aplicación
│   ├── console/                # Comandos de consola personalizados
│   │   └── commands/
│   ├── exceptions/             # Manejadores de excepciones personalizadas
│   │   ├── handler.py
│   ├── http/                   # Capa HTTP de la aplicación
│   │   ├── controllers/        # Controladores de rutas
│   │   │   ├── controller.py
│   │   ├── middleware/         # Middleware para solicitudes HTTP
│   │   │   ├── authenticate.py
│   │   │   ├── cors.py
│   │   │   └── throttle.py
│   │   └── requests/          # Clases de validación de solicitudes
│   │       └── form_request.py
│   ├── jobs/                   # Trabajos en cola (Queue jobs)
│   │   └── job.py
│   ├── models/                 # Modelos ORM/ODM
│   │   ├── model.py
│   │   └── user.py
│   ├── notifications/          # Sistema de notificaciones
│   │   └── notification.py
│   ├── providers/              # Proveedores de servicios
│   │   ├── app_service_provider.py
│   │   ├── auth_service_provider.py
│   │   └── route_service_provider.py
│   └── services/               # Lógica de negocio y servicios
│       └── user_service.py
├── bootstrap/                  # Archivos de arranque del framework
│   └── app.py
├── config/                     # Archivos de configuración
│   ├── app.py
│   ├── auth.py
│   ├── cache.py
│   ├── database.py
│   ├── mail.py
│   ├── queue.py
│   └── session.py
├── database/                   # Migraciones, seeders y fábricas
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/                  # Vistas y assets no compilados
│   ├── views/
│   ├── lang/                   # Archivos de idioma/localización
│   │   ├── en/
│   │   └── es/
│   └── assets/                 # Assets sin procesar (CSS, JS, imágenes)
│       ├── css/
│       ├── js/
│       └── images/
├── routes/                     # Definiciones de rutas
│   ├── web.py
│   ├── api.py
│   ├── console.py
│   └── channels.py
├── storage/                    # Almacenamiento de archivos y cache
│   ├── app/
│   │   ├── public/
│   │   └── private/
│   ├── framework/
│   │   ├── cache/
│   │   ├── sessions/
│   │   └── views/
│   └── logs/
├── tests/                      # Suite de pruebas
│   ├── unit/
│   ├── feature/
│   └── test_case.py
├── venv/                       # Entorno virtual de Python
├── .env                        # Variables de entorno
├── .env.example                # Ejemplo de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── requirements.txt            # Dependencias de Python
├── reactor                     # CLI del framework
└── README.md                   # Documentación del proyecto
```

### Directorio App

El directorio `app` contiene el código principal de tu aplicación. Exploraremos este directorio en detalle más adelante; sin embargo, casi todas las clases de tu aplicación estarán en este directorio.

#### Subdirectorios del directorio App

##### Console
El directorio `console` contiene todos los comandos de línea de comando personalizados de tu aplicación. Estos comandos se ejecutan a través del CLI `reactor` y son útiles para tareas de mantenimiento, procesamiento de datos y automatización.

##### Exceptions
El directorio `exceptions` alberga el manejador de excepciones de tu aplicación y cualquier excepción personalizada que definas. Aquí es donde puedes personalizar cómo tu aplicación reporta y renderiza excepciones.

##### Http
El directorio `http` contiene tus controladores, middleware y form requests. Este directorio actúa como el punto de entrada para todas las solicitudes web que ingresan a tu aplicación.

- **Controllers**: Contienen la lógica que maneja las solicitudes HTTP y devuelve respuestas.
- **Middleware**: Filtros que pueden ejecutarse antes o después de las solicitudes HTTP.
- **Requests**: Clases que encapsulan la lógica de validación para solicitudes HTTP.

##### Jobs
El directorio `jobs` contiene los trabajos en cola para tu aplicación. Los jobs pueden ser puestos en cola o ejecutados de forma síncrona dentro del ciclo de vida de la solicitud actual.

##### Models
El directorio `models` contiene todas tus clases de modelo ORM. Cada modelo representa una tabla en tu base de datos y proporciona una interfaz elegante y expresiva para interactuar con tus datos.

##### Notifications
El directorio `notifications` contiene todas las notificaciones "transaccionales" que envía tu aplicación, por defecto a través de correo electrónico. Puedes definir notificaciones para diferentes canales como correo electrónico, SMS, o notificaciones push.

##### Providers
El directorio `providers` contiene todos los proveedores de servicios para tu aplicación. Los proveedores de servicios arrancan tu aplicación vinculando servicios en el contenedor de servicios, registrando eventos, o realizando cualquier otra tarea para preparar tu aplicación para las solicitudes entrantes.

##### Services
El directorio `services` contiene clases que encapsulan la lógica de negocio compleja de tu aplicación. Este directorio ayuda a mantener tus controladores delgados y tu código reutilizable.

### Directorio Bootstrap

El directorio `bootstrap` contiene el archivo `app.py`, que inicia el framework. Es su única responsabilidad realizar el arranque (bootstrap) de la aplicación. A diferencia de otros frameworks, no se empleará para guardar cache o archivos adicionales, con el fin de no tener que dar acceso de escritura a este directorio en entornos de producción. Todo el cache generado por el framework se almacena en el directorio `storage`.

### Directorio Config

El directorio `config`, como su nombre indica, contiene todos los archivos de configuración de tu aplicación `Orionis`. Es recomendable leer estos archivos y familiarizarte con todas las opciones disponibles.

#### Archivos de configuración principales:

- **`app.py`**: Configuración general de la aplicación (nombre, entorno, debug, etc.)
- **`auth.py`**: Configuración del sistema de autenticación y autorización
- **`cache.py`**: Configuración de los drivers de cache disponibles
- **`database.py`**: Configuración de conexiones de base de datos
- **`mail.py`**: Configuración del sistema de correo electrónico
- **`queue.py`**: Configuración del sistema de colas de trabajo
- **`session.py`**: Configuración del manejo de sesiones

En el apartado anterior de la documentación se explica a detalle cómo se puede configurar `Orionis`.

### Directorio Database

El directorio `database` contiene tus migraciones de base de datos, fábricas de modelos y semillas (seeders). Si lo deseas, también puedes usar este directorio para almacenar una base de datos SQLite.

#### Subdirectorios:

- **`migrations/`**: Contiene las migraciones de base de datos que permiten versionar y modificar el esquema de la base de datos
- **`seeders/`**: Contiene clases que pueblan la base de datos con datos de prueba o iniciales
- **`factories/`**: Contiene fábricas de modelos para generar datos falsos durante el testing

### Directorio Resources

El directorio `resources` contiene tus vistas, archivos de idioma y recursos sin compilar como CSS, JavaScript e imágenes.

#### Subdirectorios:

- **`views/`**: Contiene las plantillas y vistas de tu aplicación
- **`lang/`**: Archivos de localización e internacionalización
  - `en/`: Traducciones en inglés
  - `es/`: Traducciones en español
- **`assets/`**: Recursos sin procesar
  - `css/`: Archivos de estilos CSS
  - `js/`: Archivos JavaScript
  - `images/`: Imágenes y recursos gráficos

### Directorio Routes

El directorio `routes` contiene todas las definiciones de rutas de tu aplicación. Por defecto, `Orionis` incluye cuatro archivos de rutas: `web.py`, `api.py`, `console.py` y `channels.py`.

#### Archivos de rutas:

**`web.py`**
Contiene todas las rutas definidas para manejar solicitudes HTTP normales a tu aplicación web. Estas rutas están asignadas al middleware `web`, que proporciona características como:
- Estado de sesión
- Protección CSRF
- Encriptación de cookies
- Autenticación de usuarios

**`api.py`**
Contiene rutas destinadas a ser sin estado (stateless), ideales para APIs REST. Las solicitudes que ingresan a la aplicación a través de estas rutas:
- Deben autenticarse mediante tokens (API tokens, JWT, etc.)
- No tienen acceso al estado de sesión
- Están asignadas al middleware `api`
- Generalmente devuelven respuestas en formato JSON

**`console.py`**
Contiene todas las rutas definidas para manejar comandos de consola del CLI `reactor`. Estas rutas:
- No están asociadas a ningún middleware HTTP
- Se ejecutan en la línea de comandos
- No manejan solicitudes HTTP tradicionales
- Son útiles para tareas de mantenimiento y automatización

**`channels.py`**
Es donde puedes registrar todos los canales de broadcasting de eventos que soporta tu aplicación. Útil para:
- WebSockets
- Broadcasting en tiempo real
- Notificaciones push
- Chat en vivo

### Directorio Storage

El directorio `storage` contiene archivos generados por tu aplicación, incluyendo logs, sesiones basadas en archivos, cachés de archivos y otros archivos generados por el framework. Este directorio está organizado en varios subdirectorios importantes:

#### Subdirectorios del Storage:

**`app/`**
Este directorio está destinado a almacenar cualquier archivo generado por tu aplicación. Contiene dos subdirectorios principales:

- **`public/`**: Almacena archivos que deben ser accesibles públicamente a través del servidor web:
  - Imágenes subidas por usuarios
  - Documentos descargables
  - Assets generados dinámicamente
  - Archivos CSS y JS compilados

- **`private/`**: Almacena archivos que no deben ser accesibles públicamente:
  - Documentos confidenciales
  - Archivos temporales de procesamiento
  - Backups privados
  - Archivos de usuarios que requieren autenticación para acceder

**`framework/`**
Contiene archivos generados automáticamente por el framework Orionis:

- **`cache/`**: Cache de aplicación para mejorar el rendimiento
  - Cache de configuración
  - Cache de rutas
  - Cache de servicios
  - Cache de consultas

- **`sessions/`**: Archivos de sesión cuando se usa el driver de sesiones basado en archivos
  - Datos de sesión de usuarios
  - Información temporal de autenticación
  - Estado de la aplicación por sesión

**`logs/`**
Contiene todos los archivos de registro (logs) de tu aplicación:
- Logs de errores de la aplicación

<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Recomendación clave
</p>
<div class="starlight-aside__content">
<p><strong>El directorio <code>storage</code> y todos sus subdirectorios deben tener permisos de escritura para el servidor web.</strong> En entornos de producción, asegúrate de que solo el directorio <code>storage/app/public</code> sea accesible públicamente. El resto de los subdirectorios deben permanecer privados para proteger archivos sensibles y evitar riesgos de seguridad.</p>
</div>
</aside>

Pueden agregarse más subdirectorios a `storage` en futuras versiones del framework, pero estos son los más importantes por ahora.

### Directorio Tests

El directorio `tests` contiene tu suite completa de pruebas automatizadas. `Orionis` incluye un microframework propio para testing que facilita la escritura y ejecución de pruebas.

#### Ejecución de pruebas:

Puedes ejecutar tus pruebas usando el comando `Reactor`:

```bash
python -B reactor test
```

### Directorio Venv

El directorio `venv` contiene el entorno virtual de Python para tu aplicación. Este directorio se crea cuando configuras el entorno virtual usando `python -m venv venv`.

#### Características del entorno virtual:

- **Aislamiento de dependencias**: Cada proyecto tiene sus propias dependencias independientes del sistema
- **Gestión de versiones**: Permite usar versiones específicas de paquetes sin conflictos
- **Portabilidad**: Facilita la replicación del entorno en diferentes máquinas

<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Recomendación clave
</p>
<div class="starlight-aside__content">
<p><strong>Asegúrate de agregar el directorio <code>venv</code> a tu archivo <code>.gitignore</code> para evitar subirlo al sistema de control de versiones.</strong> El entorno virtual debe recrearse en cada entorno de despliegue, nunca compartirse entre desarrolladores ni servidores.</p>
</div>
</aside>

## Archivos Importantes en la Raíz

Además de los directorios mencionados, encontrarás varios archivos importantes en la raíz de tu proyecto:

### Archivos de Configuración

**`.env`**
Contiene variables de entorno específicas para tu instalación local. **Este archivo no debe versionarse** y contiene información sensible como:
- Credenciales de base de datos
- Claves de API
- Configuraciones específicas del entorno

**`.env.example`**
Plantilla de ejemplo del archivo `.env` que sí debe versionarse. Muestra qué variables de entorno necesita la aplicación sin exponer valores reales.

**`requirements.txt`**
Lista todas las dependencias de Python necesarias para tu proyecto:
```txt
orionis-framework>=1.0.0
other-dependency>=2.3.4
another-dependency==1.2.3
```

### Archivos de Control

**`.gitignore`**
Especifica qué archivos y directorios Git debe ignorar:
```gitignore
venv/
.env
__pycache__/
*.pyc
storage/logs/*.log
```

**`reactor`**
CLI del framework. Proporciona comandos para:
- Generar código boilerplate
- Ejecutar migraciones
- Ejecutar pruebas
- Limpiar cache
- Y muchas otras tareas de desarrollo

**`README.md`**
Documentación principal del proyecto que incluye:
- Descripción del proyecto
- Instrucciones de instalación
- Guía de uso básico
- Enlaces a documentación adicional

## El Directorio App en Profundidad

La mayor parte de tu aplicación se encuentra en el directorio `app`.

### Organización

El directorio `app` contiene varios subdirectorios como `http`, `models`, `providers`, `services`, entre otros. Con el tiempo, se generarán otros directorios dentro de `app` a medida que uses los comandos `Reactor` para generar clases.

#### Filosofía de Organización

**Separación de Responsabilidades:**
- **HTTP Layer** (`http/`): Maneja la interacción con el protocolo HTTP
- **Business Logic** (`services/`): Contiene la lógica de negocio
- **Data Layer** (`models/`): Maneja la persistencia y acceso a datos
- **Infrastructure** (`providers/`): Configuración y registro de servicios

**Patrones de Diseño:**
Orionis sigue varios patrones de diseño bien establecidos:
- **MVC (Model-View-Controller)**: Para organizar la lógica de aplicación
- **Service Layer**: Para encapsular lógica de negocio compleja
- **Repository Pattern**: Para abstraer el acceso a datos
- **Provider Pattern**: Para registro y configuración de servicios

### Generación Automática de Código

<aside aria-label="Recomendación clave" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Recomendación clave
</p>
<div class="starlight-aside__content">
<p><strong>Muchas de las clases en el directorio <code>app</code> pueden generarse automáticamente usando el intérprete de consola integrado <code>Reactor</code>.</strong> Para consultar los comandos disponibles y acelerar el desarrollo, ejecuta <code>python -B reactor help</code> en tu terminal.</p>
</div>
</aside>

### Detalles de Subdirectorios Importantes

#### Directorio Console

El directorio `console` contiene todos los comandos de línea de comandos personalizados de tu aplicación. Estos comandos se ejecutan a través del CLI `reactor` y son especialmente útiles para:

- **Tareas de mantenimiento**: Limpieza de cache, optimización de base de datos
- **Procesamiento batch**: Procesamiento masivo de datos
- **Automatización**: Scripts que se ejecutan en cron jobs
- **Utilidades de desarrollo**: Comandos para generar datos de prueba

**Ejemplo de estructura:**
```
console/
├── commands/
│   ├── send_emails.py
│   ├── cleanup_logs.py
│   └── generate_reports.py
├── listeners/
│   └── your_listener.py
└── scheduler.py
```

**Características de los comandos:**
- Herencia de clase base `Command`
- Definición de signature y descripción
- Manejo de argumentos y opciones
- Integración con el sistema de logging
- Acceso completo al contenedor de servicios

#### Directorio Http en Detalle

El directorio `http` es el corazón de tu aplicación web y está organizado en tres subdirectorios principales:

**Controllers**
- Manejan la lógica de solicitudes HTTP
- Deben mantenerse delgados (thin controllers)
- Delegan lógica compleja a servicios
- Retornan respuestas HTTP apropiadas

**Middleware**
- Filtros que se ejecutan antes/después de las solicitudes
- Útiles para autenticación, logging, CORS, rate limiting
- Pueden modificar solicitudes y respuestas
- Se organizan en una pila (stack) de ejecución

**Requests**
- Encapsulan validación y autorización
- Procesan datos de entrada
- Proporcionan mensajes de error personalizados
- Mantienen controladores limpios de lógica de validación

<aside aria-label="Nota" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Nota clave
</p>
<div class="starlight-aside__content">
<p><strong>Los directorios <code>console</code> y <code>http</code> funcionan como APIs para interactuar con el núcleo de tu aplicación.</strong> El protocolo HTTP y la CLI son mecanismos de entrada, pero no contienen lógica de negocio. Son interfaces separadas para emitir comandos, manteniendo la lógica de negocio aislada y centralizada en otros componentes.</p>
</div>
</aside>

Esta organización permite mantener una arquitectura limpia y escalable, donde cada componente tiene responsabilidades bien definidas y la lógica de negocio permanece independiente de los mecanismos de entrega.
